

const createAnnouncement = (req, res) => {
    console.log(req.body);
    res.status(200).json({ success: true, message: 'Announcement created', data: req.body });
};

module.exports = {
    createAnnouncement
}