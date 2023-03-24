const sgMail = require("@sendgrid/mail");
const dotenv = require('dotenv');

dotenv.config({path: "../config.env"})

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendSGMail = async ({
  to,
  from,
  subject,
  html,
  text,
  attachments,
}) => {
  try {
    // console.log(from,"sender mail address")
    // const from = from || "bla bla bla";

    const msg = {
      to: to,
      from: from,
      subject,
      html: html,
      text: text,
      attachments,
    };
console.log(process.env.SENDGRID_API_KEY,"SENDGRID_API_KEY////////////////////////////////////////////")

   const response =  sgMail.send(msg).then((response) => {
    console.log(response," mail response")
   }).catch((error) => {
    console.log(error, "mail error")
   });

  //  console.log(response,"mail response")
   return response
  } catch (error) {
    console.log(error, "send grid error");
  }
};

exports.sendMail = async (args) => {
  console.log(args, "arguments ------------")
    if(process.env.NODE_ENV === 'development'){
        return new Promise.resolve();
    }else{
        return sendSGMail(args)
    }
}