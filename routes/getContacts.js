module.exports = (io,sessions) => {
    const express = require('express');
    const router = express.Router();
    const { findAndCheckClient } = require('../helpers/utils');

    // Endpoint untuk mendapatkan daftar getContacts
    router.get('/get_contacts', async (req, res) => {
        // Ambil parameter
        const { key } = req.query;
        console.log('key '+key);

        try {
            // Cari dan periksa client session
            const client = findAndCheckClient(key,sessions);

            // Panggil method getContactById() dari client
            const response = await client.getContacts();
            res.status(200).json({
                status: true,
                response: response
            });

            //Io Socket & log
            io.emit('message', { id: key, text: 'Berhasil mendapatkan daftar getContacts ' });
            console.log('success /api/get_contacts key : '+key);
        } catch (err) {
            res.status(422).json({
                status: false,
                message: err.message
            });

            //Io Socket & log
            io.emit('message', { id: key, text: 'Error mendapatkan daftar getContacts ' });
            console.log('error /api/get_contacts key : '+key);
        }
    });

    // Endpoint untuk mendapatkan daftar get_contact_by_id
    router.get('/get_contact_by_id', async (req, res) => {
        // Ambil parameter
        const { key, phone_no } = req.query;
        console.log('key '+key);
    
        try {
            // Cari dan periksa client session
            const client = findAndCheckClient(key,sessions);
        
            // Panggil method getContactById() dari client
            const response = await client.getContactById(phone_no);
            res.status(200).json({
                status: true,
                response: response
            });

            //Io Socket & log
            io.emit('message', { id: key, text: 'Berhasil mendapatkan daftar getContactById ' });
            console.log('success /api/get_contact_by_id key : '+key);
        } catch (err) {
            res.status(422).json({
                status: false,
                message: err.message
            });

            //Io Socket & log
            io.emit('message', { id: key, text: 'Error mendapatkan daftar getContactById ' });
            console.log('error /api/get_contact_by_id key : '+key);
        }
    });

    return router;
}
