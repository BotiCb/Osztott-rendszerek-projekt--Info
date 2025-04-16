import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { config } from 'src/shared/config/config';
import { FormModel, FormSchema } from 'src/shared/schemas/form.schema';
import { QuestionModel, QuestionSchema } from 'src/shared/schemas/question.schema';

@Module({
  imports: [
    MongooseModule.forRoot(config.get('db.url')),
    MongooseModule.forFeature([{ name: FormModel.name, schema: FormSchema, collection: 'Form' }]),
    MongooseModule.forFeature([{ name: QuestionModel.name, schema: QuestionSchema, collection: 'Question' }]),
  ],
  exports: [
    MongooseModule.forFeature([{ name: FormModel.name, schema: FormSchema, collection: 'Form' }]),
    MongooseModule.forFeature([{ name: QuestionModel.name, schema: QuestionSchema, collection: 'Question' }]),
  ],
})
export class SzavazoRendszerMongooseModule {}
