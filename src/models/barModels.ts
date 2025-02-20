import { BarScheduleStatus, BarType, CrowdMeter, Day } from "@shared/enums";
import mongoose, { Schema } from "mongoose";

export type BarSchema = {
  name: string;
  barType: BarType;
  waitTime: number;
  crowdMeter: CrowdMeter;
  reviews: number;
  cover: string;
  gallery: string[];
  about: {
    address: {
      placeName: string;
      latitude: number;
      longitude: number;
    };
    schedule: {
      day: Day;
      time: string;
      status: BarScheduleStatus;
    };
    dressCode: string[];
    music: string[];
    snacks: {
      name: string;
      cost: number;
    }[];
    drinks: {
      name: string;
      cost: number;
    }[];
    website: string;
  }
}

const barSchema = new Schema<BarSchema>({
  name: { type: String, required: true },
  barType: { type: String, enum: Object.values(BarType), required: true },
  waitTime: { type: Number, required: true },
  crowdMeter: { type: String, enum: Object.values(CrowdMeter), required: true },
  reviews: { type: Number, required: true },
  cover: { type: String, required: true },
  gallery: { type: [String], required: true },
  about: {
    address: {
      placeName: { type: String, required: true },
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true }
    },
    schedule: {
      day: { type: String, enum: Object.values(Day), required: true },
      time: { type: String, required: true },
      status: { type: String, enum: Object.values(BarScheduleStatus), required: true }
    },
    dressCode: { type: [String], required: true },
    music: { type: [String], required: true },
    snacks: [
      {
        name: { type: String, required: true },
        cost: { type: Number, required: true }
      }
    ],
    drinks: [
      {
        name: { type: String, required: true },
        cost: { type: Number, required: true }
      }
    ],
    website: { type: String, required: true }
  }
}, { timestamps: true });

const Bar = mongoose.model<BarSchema>("Bar", barSchema);
export default Bar;