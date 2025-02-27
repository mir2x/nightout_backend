import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import Bar, { BarSchema } from "@models/barModels";
import createError from "http-errors";
import Cloudinary from "@shared/cloudinary";

const create = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const cover = req.body.cover;
  const gallery = req.body.gallery;
  const data = JSON.parse(req.body.data);
  const newBar = new Bar({
    name: data.name,
    barType: data.barType,
    waitTime: data.waitTime,
    crowdMeter: data.crowdMeter,
    reviews: data.reviews,
    cover,
    gallery,
    about: data.about
  });
  const bar = await newBar.save();
  return res.status(StatusCodes.OK).json({success: true, message: "Bar crated successfully.", data: bar});
}

const getById = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const id = req.params.id;
  const bar = await Bar.findById(id);
  return res.status(StatusCodes.OK).json({success: true, message: "Bar crated successfully.", data: bar});
}

const getAllBars = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const { search } = req.query;
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 10;
  const skip = (page - 1) * limit;

  if (page < 1 || limit < 1) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: "Page and limit must be positive integers",
      data: {}
    });
  }

  const matchCriteria = search ? {
    $or: [
      { name: { $regex: search, $options: "i" } },
      { placeName: { $regex: search, $options: "i" } }
    ]
  } : {};

  const bars = await Bar.find(matchCriteria).limit(limit).skip(skip).lean();
  const total = bars.length;
  const totalPages = Math.ceil(total / limit);

  return res.status(StatusCodes.OK).json({
    success: true, message: "Success", data: {
      bars,
      pagination: { page, limit, total, totalPages }
    }
  });
};

const update = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const id = req.params.id;
  const bar = await Bar.findById(id);
  if(!bar) throw createError(StatusCodes.NOT_FOUND, "Bar not found");
  let updatedFields: Record<string, any> = {};
  if(req.body.data) {
    updatedFields = JSON.parse(req.body.data);
  }
  if(req.body.cover && !bar.cover) {
    await Cloudinary.remove(bar.cover);
    updatedFields.cover = req.body.cover;
  }
  if(!updatedFields) throw createError(StatusCodes.BAD_REQUEST, "Nothing to update");
  const updatedBar = await Bar.findByIdAndUpdate(id, {$set: updatedFields}, {new : true});
  return res.status(StatusCodes.OK).json({success: true, message: "Bar updated successfully", data: updatedBar});
}

const remove = async (req: Request, res: Response, next: NextFunction) : Promise<any> => {
  const id = req.params.id;
  const bar = await Bar.findById(id);
  if(!bar) throw createError(StatusCodes.NOT_FOUND, "Bar not found");
  await Bar.findByIdAndDelete(id);
  return res.status(StatusCodes.OK).json({success: true, message: "Bar deleted successfully.", data: bar});
}

const BarController = {
  create,
  getById,
  getAllBars,
  update,
  remove
}

export default BarController;