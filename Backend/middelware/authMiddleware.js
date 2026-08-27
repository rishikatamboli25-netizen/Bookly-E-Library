import jwt from "jsonwebtoken";
import "dotenv/config";

const authMiddleware = (req, res, next) =>{
    console.log("Got the request")
    try{
        const authHeader = req.headers.authorization;

        if(!authHeader) {
            return res.status(401).json({
              message: "Authentication required",
            });
        }

        const token = authHeader.split(" ")[1];

        if(!token) {
            return res.status(401).json({
                message: "Token not found",
            });
        }

        console.log(process.env.jwt_SECERT)

        const decoded = jwt.verify(token, process.env.jwt_SECERT);

        req.userId = decoded.userId;
        next();
        console.log("Request forwarded")
    }catch(error){
        console.error("Authentication error:", error);

        return res.status(401).json({
            message: "Invalid or expired token",
        });
    }

};


export default authMiddleware;