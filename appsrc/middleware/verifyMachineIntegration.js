const { StatusCodes, getReasonPhrase } = require("http-status-codes");
const { ProductStatus, Product } = require("../modules/products/models");


const verifyMachineAuth = async (req, res, next) => {
  if (!req.headers["x-portal-key"] || !req.headers["x-machine-serial-no"] || !req.headers["x-ipc-serial-no"] || !req.headers["x-computer-guid"]) {
    return next();
  }
  try {
    const { 
      "x-machine-serial-no": machineSerialNo,
      "x-computer-guid": computerGUID,
      "x-ipc-serial-no": IPCSerialNo,
      "x-portal-key": howickPortalKey
    } = req.headers;
    const transferredStatus = await ProductStatus.findOne({ name: 'Transferred' });
    const decommissionedStatus = await ProductStatus.findOne({ name: 'Decommissioned' });

    const machine = await Product.findOne({
      serialNo: machineSerialNo,
      isActive: true,
      isArchived: false,
      status: { $nin: [transferredStatus._id, decommissionedStatus._id] },
    }).populate(['status', 'customer']);

    if (!machine) {
      return res.status(StatusCodes.NOT_FOUND).json({ 
        message: "Machine not found or has been transferred or decommissioned" 
      });
    }

    if (!machine.machineIntegrationSyncStatus?.syncStatus) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ 
        message: "Machine integration not synchronized" 
      });
    }

    const latestPortalKey = machine.portalKey[0]?.key;

    if (machine.computerGUID !== computerGUID || 
        machine.IPC_SerialNo !== IPCSerialNo || 
        latestPortalKey !== howickPortalKey) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ 
        message: "Invalid machine credentials" 
      });
    }

    req.machine = machine;
    req.customer = machine.customer;
    req.clientInfo = {
      ip: req.headers["x-forwarded-for"]?.split(",").shift() || req.socket?.remoteAddress,
      identifier: `${req.headers["user-agent"]}|${req.headers.origin || req.headers.referer || 'direct'}`
    };

    next();
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error);
  }
};

module.exports = verifyMachineAuth;
