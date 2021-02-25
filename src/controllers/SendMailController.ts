import { Request, Response } from 'express';
import { getCustomRepository } from 'typeorm';
import { resolve } from 'path';

import { SurveysRepository } from '../repositories/SurveysRepository';
import { SurveysUsersRepository } from '../repositories/SurveysUsersRepository';
import { UsersRepository } from '../repositories/UsersRepository';
import sendMailService from '../services/sendMailService';

class SendMailController {
  async execute(request: Request, response: Response) {
    const { email, survey_id } = request.body;

    const usersRepository = getCustomRepository(UsersRepository);
    const surveyRepository = getCustomRepository(SurveysRepository);
    const surveysUsersRepository = getCustomRepository(SurveysUsersRepository);

    const userExists = await usersRepository.findOne({ email });

    if (!userExists) {
      return response.status(400).json({ Error: 'User does not exists' });
    }

    const surveyExists = await surveyRepository.findOne({ id: survey_id });

    if (!surveyExists) {
      return response.status(400).json({ Error: 'Survey does not exists' });
    }

    const npsPath = resolve(__dirname, '..', 'views', 'emails', 'npsMail.hbs');

    const variables = {
      user_id: userExists.id,
      name: userExists.name,
      title: surveyExists.title,
      description: surveyExists.description,
      link: process.env.URL_MAIL,
    };

    const surveysUsers = await surveysUsersRepository.findOne({
      where: [{ user_id: userExists.id }, { value: null }],
      relations: ['user', 'survey'],
    });

    if (surveysUsers) {
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

    await sendMailService.execute({
      to: userExists.email,
      subject: surveyExists.title,
      path: npsPath,
      variables,
    });

    return response.status(200).json(surveyUser);
  }
}

export { SendMailController };
