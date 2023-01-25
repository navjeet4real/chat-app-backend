 const filterObject = (obj, ...aloowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach((item) => {
        if(aloowedFields.includes(item)) newObj[item] = obj[item]
    });
    return newObj;
 }

 module.exports = filterObject();