const express = require('express')
const router = express.router()
const zod = require('zod')
const { User, Account } = require('../db')
const jwt = require('jsonwebtoken');



const signupSchema = zod.object({
    username: zod.string(),
    password: zod.string(),
    firstName: zod.string(),
    lastName: zod.string(),
})
router.post('/signup', async (req, res) => {
    const body = req.body
    const { success } = signupSchema.safeParse(req.body)
    if (!success) {
        res.json({
            message: "User already signed up / Invalid credentials"
        })
    }

    const existingUser = User.findOne({
        username: body.username
    })
    if (existingUser) {
        res.json({
            message: "User already signed up / Invalid credentials"
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
    }, JWT_SECRET)

    res.json({
        message: "User signed up successfully",
        token
    })
})

module.exports = router;