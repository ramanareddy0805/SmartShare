const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const File = require('../models/file');
const { v4: uuid4} = require('uuid');


let storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
              cb(null, uniqueName)
    } 
})

let upload = multer({
    storage: storage,
    limits: {fileSize: 1000000 * 100},

}).single('myfile');

router.post('/', (req, res) => {

    //store files in uploads
    upload(req, res, async(err) => {
        //validate the request
    if(!req.file){
        return res.json({ error: 'All fields are required.'});
    }

        if(err){
            return res.status(500).send({ error: err.message});
        }

        // store in the database
        const file = new File({
            filename: req.file.filename,
            uuid: uuid4(),
            path: req.file.path,
            size: req.file.size
        });
        const response = await file.save();
        return res.json({ file: `${process.env.APP_BASE_URL}/files/${response.uuid}`});
        // the url may look like
        //http://localhost:3000/files/(uuid)

    });

    router.post('/send', async(req, res) => {
        const {uuid, emailTo, emailFrom} = req.body;
        //validate the request

        if(!uuid || !emailFrom || !emailTo){
            return res.status(422).send({error: 'All fields are required.'});
        }

        //get data from database
        const file = await File.findOne({ uuid: uuid});
        if(file.sender){
            return res.status(422).send({error: 'Email already sent.'});

        }

        file.sender = emailFrom;
        file.receiver = emailTo;
        const response = await file.save();

        //send email
        const sendMail = require('../services/emailService');
        sendMail({
            from: emailFrom,
            to: emailTo,
            subject: "SmartShare File Sharing",
            text: `${emailFrom} has shared a file with you`,
            html: require('../services/emailTemplate')({ 
                emailFrom: emailFrom,
                downloadLink: `${process.env.APP_BASE_URL}/files/${file.uuid}`,
                size: parseInt(file.size/1000) + 'KB',
                expires: '24 Hours'
            })
        });
        
    });

    //send the link as response

});













module.exports = router;