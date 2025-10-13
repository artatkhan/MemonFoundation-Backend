// services/studentEmailAdminService.js

const StudentEmailToAdmin = require("../models/SentEmail");

class StudentEmailAdminService {
    /**
     * Student sends an email to the admin
     */
    static async sendEmailToAdmin(req) {
        try {
            const { _id: studentId, type } = req.user; // assuming JWT middleware sets req.user
            const { subject, message } = req.body;

            // Allow only students
            if (type !== "student") {
                return { status: 403, message: "Only students can send emails to admin" };
            }

            // Validate fields
            if (!subject || !message) {
                return { status: 400, message: "Subject and message are required" };
            }

            const email = new StudentEmailToAdmin({
                studentId,
                subject,
                message,
            });

            await email.save();

            return {
                status: 200,
                message: "Email sent to admin successfully",
                data: email,
            };
        } catch (error) {
            console.error("Error sending email to admin:", error);
            return {
                status: 500,
                message: "Internal server error",
            };
        }
    }

    /**
     * Admin gets all student emails
     */
    static async getAllStudentEmails(req) {
        try {
            const { type } = req.user;
            if (type !== "admin" && type !== "superadmin") {
                return { status: 403, message: "Only admins can view student emails" };
            }

            const emails = await StudentEmailToAdmin.find()
                .populate("studentId", "name email") // optional: enrich with student info
                .sort({ createdAt: -1 });

            return {
                status: 200,
                message: "Student emails fetched successfully",
                data: emails,
            };
        } catch (error) {
            console.error("Error fetching emails:", error);
            return {
                status: 500,
                message: "Failed to fetch emails",
            };
        }
    }

    static async getStudentEmailById(req) {
        try {
            const { type } = req.user;
            if (type !== "admin" && type !== "superadmin") {
                return { status: 403, message: "Only admins can view student emails" };
            }

            const { id } = req.params;

            const email = await StudentEmailToAdmin.findById(id)
                .populate("studentId", "name email");

            if (!email) {
                return {
                    status: 404,
                    message: "Email not found",
                };
            }

            return {
                status: 200,
                message: "Student email fetched successfully",
                data: email,
            };
        } catch (error) {
            console.error("Error fetching email by ID:", error);
            return {
                status: 500,
                message: "Failed to fetch email",
            };
        }
    }
}

module.exports = StudentEmailAdminService;
