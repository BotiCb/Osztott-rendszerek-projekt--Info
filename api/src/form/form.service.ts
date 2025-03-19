import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FormModel } from 'src/shared/schemas/form.schema';
import { QuestionModel } from 'src/shared/schemas/question.schema';

@Injectable()
export class FormService {
  constructor(
    @InjectModel(FormModel.name) private formModel: Model<FormModel>,
    @InjectModel(QuestionModel.name) private QuestionModel: Model<QuestionModel>
  ) {}

  async create(data: { name: string }): Promise<FormModel> {
    const newForm = new this.formModel(data);
    return newForm.save();
  }

  async findAllFiltered(name?: string): Promise<FormModel[]> {
    const filter: any = {};
    if (name) {
      filter.name = name;
    }
    return await this.formModel.find(filter).populate('questions').exec();
  }

  async addQuestion(addQuestionDto: { questionText: string; questionType: string }, formName: string) {
    const form = await this.formModel.findOne({ name: formName }).exec();
    const newQuestion = await this.QuestionModel.create(addQuestionDto);
    form.questions.push(newQuestion);
    await form.save();
  }
}
