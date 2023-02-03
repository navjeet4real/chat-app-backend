// exports.filterObject = (obj, ...aloowedFields) => {
//     const newObj = {};
//     Object.keys(obj).forEach((item) => {
//         if(aloowedFields.includes(item)) newObj[item] = obj[item]
//     });
//     return newObj;
//  }

// //  module.exports = filterObject();
const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach((el) => {
      if (allowedFields.includes(el)) newObj[el] = obj[el];
    });
    return newObj;
  };
  
  module.exports = filterObj;