import expressAsyncHandler from "express-async-handler";
import jwt from "jsonwebtoken";

const userJwt = expressAsyncHandler(async (req, res, next) =>{
    const token = req.header('Authorization');
    if(!token){
        return res.status(401).send({
            msg:'no token, unauthorised'
        })
    }
    //save jwtsecret in .env
    try {
        await jwt.verify(token, "jwtsecret", (err, decoded) => {
            if(err){
                res.status(401).send({
                    msg:'token not valid'
                })
            } else{
                req.user = decoded.user;
                next();
            }
        })
    } catch (error) {
        res.status(500).send({
            msg: 'server error'
        })
    }

})


export default userJwt;