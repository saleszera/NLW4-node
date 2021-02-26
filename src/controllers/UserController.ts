import { Request, Response } from 'express';
import { getCustomRepository } from 'typeorm';
import * as Yup from 'yup';
import { AppError } from '../errors/AppError';
import { UsersRepository } from '../repositories/UsersRepository';

class UserController {
  async create(request: Request, response: Response): Promise<Response> {
    const { name, email } = request.body;

    const schema = Yup.object().shape({
      name: Yup.string().required('Nome é obrigatório'),
      email: Yup.string()
        .email('E-mail incorreto')
        .required('E-mail é obrigatório'),
    });

    // if (!(await schema.isValid(request.body))) {
    //   return response.status(400).json({ Error: 'Validate failed' });
    // }

    try {
      await schema.validate(request.body, { abortEarly: false });
    } catch (error) {
      throw new AppError(error);
    }

    const usersRepository = getCustomRepository(UsersRepository);

    const userExists = await usersRepository.findOne({ email });

    if (userExists) {
      throw new AppError('Email is already exists');
    }

    const user = usersRepository.create({
      name,
      email,
    });

    await usersRepository.save(user);

    return response.status(201).json(user);
  }
}

export { UserController };
