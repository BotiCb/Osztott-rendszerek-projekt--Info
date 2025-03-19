import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { QuestionModel } from './question.schema';

@Schema()
export class FormModel extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, ref: 'QuestionModel', type: [MongooseSchema.Types.ObjectId] })
  questions: QuestionModel[];
}

export const FormSchema = SchemaFactory.createForClass(FormModel);
