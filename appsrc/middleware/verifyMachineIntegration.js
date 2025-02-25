const { StatusCodes, getReasonPhrase } = require("http-status-codes");
const { ProductStatus, Product } = require("../modules/products/models");


const verifyMachineAuth = async (req, res, next) => {
  if (!req.headers["howickportalkey"] || !req.headers["machineserialno"] || !req.headers["ipcserialno"] || !req.headers["computerguid"]) {
    return next();
  }
  try {
    const {
      "machineserialno": machineSerialNo,
      "computerguid": computerGUID,
      "ipcserialno": IPCSerialNo,
      "howickportalkey": howickPortalKey
    } = req.headers;

    const clientIP = req.headers["x-clientip"];
    const clientIdentifier = req.headers["x-clientidentifier"];

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
      ip: clientIP,
      identifier: clientIdentifier
    };

    next();
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(error);
  }
};

module.exports = verifyMachineAuth;
