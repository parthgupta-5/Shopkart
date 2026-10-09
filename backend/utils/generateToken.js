import jwt from "jsonwebtoken";

export function generateToken(customerId) {
  return jwt.sign({ id: customerId }, process.env.JWT_SECRET, { expiresIn: "10d" });
}

export default generateToken;