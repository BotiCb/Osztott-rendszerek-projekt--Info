import { Controller, Get, Post, Body, Query, Put, Param } from '@nestjs/common';
import { FormService } from './form.service';

@Controller('form')
export class FormController {
  constructor(private readonly formService: FormService) {}

  @Post()
  async createForm(@Body() createFormDto: { name: string }) {
    return this.formService.create(createFormDto);
  }

  @Get()
  async getForms(@Query('name') name?: string) {
    return this.formService.findAllFiltered(name);
  }

  @Put(':name')
  async addQuestionToForm(
    @Body() addQuestionDto: { questionText: string; questionType: string },
    @Param('name') name: string
  ) {
    return this.formService.addQuestion(addQuestionDto, name);
  }
}
