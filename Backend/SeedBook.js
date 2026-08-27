import mongoose from "mongoose";
import Book from "./models/Books.js";
import books from "./data/internetArchiveBooks.json" with {type: "json"};
import "dotenv/config";



const SeedBooks = async ()=>{
try{
  await mongoose.connect(process.env.MONGODB_URI)
  console.log("connected DB")

  await Book.deleteMany({});
  console.log("old books deleted")

  await Book.insertMany(books);
  console.log("Books inserted")

  await mongoose.connection.close();

  process.exit(0);
} catch (error){
  console.error("error", error);

  await mongoose.connection.close();
  process.exit(1)
}
};

SeedBooks();