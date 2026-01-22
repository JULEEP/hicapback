// models/ChatGroup.js
const mongoose = require('mongoose');

const chatGroupSchema = new mongoose.Schema({
  groupName: { type: String, },
  enrollmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Enrollment',},
  enrolledUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'UserRegister' }],
  status: { type: String, enum: ['Pending', 'Accepted'], default: 'Pending' }, // Status to track if user accepted the group
}, { timestamps: true });

module.exports = mongoose.model('ChatGroup', chatGroupSchema);
