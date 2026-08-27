import axios from "axios";
import fs from 'fs'

export const fetchBooks = async ()=>{
    try{
        const response = await axios.get("https://openlibrary.org/search.json?q=popular")

     const books =  response.data.docs;

     const fileContent = `export const books = ${JSON.stringify(books, null, 2)}`;

     console.log(fileContent)

     fs.writeFileSync('./src/data.js', fileContent)
    }catch (err){
        console.error("Error:", err)
    }
    
}

fetchBooks()
