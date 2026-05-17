import { Controller, Post, Body } from '@nestjs/common';
import { AiService } from './ai.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class AskDto {
  @IsString()
  @IsNotEmpty()
  question: string;
}

@ApiTags('AI Assistant')
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('ask')
  @ApiOperation({ summary: 'Process natural language query and return DB analytical response' })
  async ask(@Body() body: AskDto) {
    if (!body.question || !body.question.trim()) {
      return { response: 'Por favor, digite uma pergunta para que eu possa analisar os dados.' };
    }
    const response = await this.aiService.processNaturalLanguageQuery(body.question);
    return { response };
  }
}
