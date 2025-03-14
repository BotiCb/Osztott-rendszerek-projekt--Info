import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { QuestionType } from '../utils/types';

@Schema()
export class QuestionModel extends Document {
  @Prop({ required: true })
  questionText: string;

  @Prop({ required: true })
  questionType: QuestionType;
}

export const QuestionSchema = SchemaFactory.createForClass(QuestionModel);
