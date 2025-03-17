
const getDateFromUnitAndValue = ({ unit, value }) => {
    if (!unit || isNaN(value)) {
        return null;
    }

    const lowerUnit = unit.toLowerCase();
    const numericValue = Number(value);

    const date = new Date();

    switch (lowerUnit) {
        case "day":
        case "daily":
            date.setDate(date.getDate() - numericValue);
            break;
        case "month":
        case "monthly":
            date.setMonth(date.getMonth() - numericValue);
            break;
        case "year":
        case "yearly":
            date.setFullYear(date.getFullYear() - numericValue);
            break;
        default:
            throw new Error("Invalid unit. Use Day, Month, or Year.");
    }

    return date;
};

module.exports = getDateFromUnitAndValue;
