import { Schema, model, models, type Document, type Model } from 'mongoose';

export interface AlertItem extends Document {
    userId: string,
    symbol: string,
    company: string,
    alertName: string;
    alertType: 'price' | 'volume';
    condition: 'greater' | 'less' | 'moves_up_by' | 'moves_down_by';
    threshold: number;
    frequency: 'once' | 'once_per_minute' | 'once_per_hour' | 'once_per_day';
    active: boolean;
    lastTriggeredAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const AlertSchema = new Schema<AlertItem>(
    {
        userId: {type: String, required: true, index: true},
        symbol: {type: String, required: true, uppercase: true, trim: true},
        company: {type: String, required: true},
        alertName: { type: String, required: true},
        alertType: { type: String, enum: ['price', 'volume'] , default: 'price'},
        condition: { type: String, enum: ['greater', 'less', 'moves_up_by' ,'moves_down_by'], required: true},
        threshold: { type: Number, required: true},
        frequency: { type: String, enum: ['once', 'once_per_minute' , 'once_per_hour' , 'once_per_day'], default: 'once'},
        active: { type: Boolean, default: true},
        lastTriggeredAt: { type: Date },
    },
    { 
        timestamps: true 
    }
);

export const AlertModel: Model<AlertItem> = (models?.Alert as Model<AlertItem>) || model<AlertItem>('Alert', AlertSchema);