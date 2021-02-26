import { Request, Response } from 'express';
import { getCustomRepository } from 'typeorm';
import { resolve } from 'path';

import { SurveysRepository } from '../repositories/SurveysRepository';
import { SurveysUsersRepository } from '../repositories/SurveysUsersRepository';
import { UsersRepository } from '../repositories/UsersRepository';
import sendMailService from '../services/sendMailService';
import { AppError } from '../errors/AppError';

class SendMailController {
  async execute(request: Request, response: Response): Promise<Response> {
    const { email, survey_id } = request.body;

    const usersRepository = getCustomRepository(UsersRepository);
    const surveyRepository = getCustomRepository(SurveysRepository);
    const surveysUsersRepository = getCustomRepository(SurveysUsersRepository);

    const userExists = await usersRepository.findOne({ email });

    if (!userExists) {
      throw new AppError('User does not exists');
    }

    const surveyExists = await surveyRepository.findOne({ id: survey_id });

    if (!surveyExists) {
      throw new AppError('Survey does not exists');
    }

    const npsPath = resolve(__dirname, '..', 'views', 'emails', 'npsMail.hbs');

    const surveysUsers = await surveysUsersRepository.findOne({
      where: { user_id: userExists.id, value: null },
      relations: ['user', 'survey'],
    });

    const variables = {
      id: '',
      name: userExists.name,
      title: surveyExists.title,
      description: surveyExists.description,
      link: process.env.URL_MAIL,
    };

    if (surveysUsers) {
      variables.id = surveysUsers.id;
      await sendMailService.execute({
        to: userExists.email,
        subject: surveyExists.title,
        path: npsPath,
        variables,
      });

      return response.json(surveysUsers);
    }

    const surveyUser = surveysUsersRepository.create({
      user_id: userExists.id,
      survey_id,
    });

    await surveysUsersRepository.save(surveyUser);

    variables.id = surveyUser.id;

    await sendMailService.execute({
      to: userExists.email,
      subject: surveyExists.title,
      path: npsPath,
      variables,
    });

    return response.status(201).json(surveyUser);
  }
}

export { SendMailController };
