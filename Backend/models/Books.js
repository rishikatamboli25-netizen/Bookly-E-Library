import mongoose, { Types } from "mongoose";

const fileSchema = new mongoose.Schema(
  {
    name: {
     type: String,
     required: true,
    },

    url:{
      type: String,
      required: true,
    },

    size:{
      type:Number,
      default:null
    },

    contentType: {
      type:String,
      default:null
    },
  },
  { _id:false }
);




const bookSchema = new mongoose.Schema(
  {
    identifier:{
      type:String,
      required:true,
      unique:true,
      index:true,
    },

    title:{
      type:String,
      required: true,
      trim: true,
    },

    author:{
      type:String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: null,
    },

    category: {
      type: String,
      required: true,
      index: true,
    },

    subjects: {
      type: [String],
      default: [],
    },
    

    language: {
      type: String,
      default: null,
    },
    

     year: {
      type: Number,
      default: null,
    },

    files: {
      pdf: {
        type: fileSchema,
        default: null,
      },

      epub: {
        type: fileSchema,
        default: null,
      },
    },

    source: {
      name: {
        type: String,
        default: null,
      },

      itemUrl: {
        type: String,
        default: null,
      },
  },
},
{
  timestamps:true,
}
);


const Book = mongoose.model("Book", bookSchema)

export default Book;