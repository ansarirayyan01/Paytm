const express = require('express')
const router = express.Router()
const zod = require('zod')
const { User, Account } = require('../db')
const jwt = require('jsonwebtoken');
const { authMiddleware } = require('../middleware');
const {JWT_SECRET} = require('../config');



const signupBody = zod.object({
    username: zod.string().email(),
	firstName: zod.string(),
	lastName: zod.string(),
	password: zod.string()
})
router.post("/signup", async (req, res) => {
    const { success } = signupBody.safeParse(req.body)
    if (!success) {
        return res.status(411).json({
            message: "Email already taken / Incorrect inputs"
        })
    }

    const existingUser = await User.findOne({
        username: req.body.username
    })

    if (existingUser) {
        return res.status(411).json({
            message: "Email already taken/Incorrect inputs"
        })
    }

    const user = await User.create({
        username: req.body.username,
        password: req.body.password,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
    })
    const userId = user._id;

    await Account.create({
        userId,
        balance: 1 + Math.random() * 10000
    })

    const token = jwt.sign({
        userId
    }, JWT_SECRET);

    res.json({
        message: "User created successfully",
        token: token
    })
})

const loginSchema = zod.object({
    username: zod.string().email(),
    password: zod.string(),
})

router.post('/signin', async (req, res) => {
    const body = req.body
    const { success } = loginSchema.safeParse(req.body)
    if (!success) {
        res.json({
            message: "Invalid credentials"
        })
    }
    const user = await User.findOne({
        username: body.username,
        password: body.password,
    })
    if (user) {
        const token = jwt.sign({
            userId: user._id
        }, JWT_SECRET)

        res.json({
            message: "Logged in successfully",
            token: token
        })
    }


})

const updateBody = zod.object({
    firstName: zod.string().optional(),
    lastName: zod.string().optional(),
    password: zod.string().optional(),
})

router.put("/", authMiddleware, async (req, res) => {
    const { success } = updateBody.safeParse(req.body)
    if (!success) {
        res.status(411).json({
            message: "Error while updating information"
        })
    }

    await User.updateOne(req.body, {
        id: req.userId
    })

    res.json({
        message: "Updated successfully"
    })
})

router.get('/bulk', authMiddleware, async (req, res) => {
    const filter = req.query.filter || ""

    const users = await User.find({
        $or: [{
            firstName: {
                '$regex': filter,
            },
            lastName: {
                '$regex': filter,
            }
        }]
    })

    res.json({
        user: users.map(user => ({
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username,
        }))
    })
})

module.exports = router