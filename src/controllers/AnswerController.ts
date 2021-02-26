import { Request, Response } from 'express';
import { getCustomRepository } from 'typeorm';
import { AppError } from '../errors/AppError';
import { SurveysUsersRepository } from '../repositories/SurveysUsersRepository';

class AnswerController {
  async execute(request: Request, response: Response): Promise<Response> {
    const { value } = request.params;
    const { u } = request.query;

    const surveysUsers = getCustomRepository(SurveysUsersRepository);

    const surveyUser = await surveysUsers.findOne({ id: String(u) });

    if (!surveyUser) {
      throw new AppError('Survey User does not exist!');
    }

    surveyUser.value = Number(value);

    await surveysUsers.save(surveyUser);

    return response.json(surveyUser);
  }
}

export { AnswerController };
