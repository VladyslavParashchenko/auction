import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { UsersService } from '#app-root/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { MailService } from '#app-root/mail/mail.service';
import { ForgotPasswordDto } from '#app-root/auth/dto/forgot-password.dto';
import { ResetPasswordDto } from '#app-root/auth/dto/reset-password.dto';
import * as bcrypt from 'bcrypt';
import { IUser } from '#app-root/users/interfaces/user.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    const isPasswordMatching = await this.isVerifyPassword(
      password,
      user?.password,
    );

    if (!user || !isPasswordMatching) {
      throw new HttpException(
        'Wrong credentials provided',
        HttpStatus.BAD_REQUEST,
      );
    }
    return user;
  }

  async login(user: IUser) {
    const token = this.createJwtPlayload(user);
    await this.usersService.update(user._id, {
      isRememberMe: user.isRememberMe,
    });

    return { token };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(forgotPasswordDto.email);

    if (!user) {
      throw new HttpException('Invalid email', HttpStatus.BAD_REQUEST);
    }

    const token = this.createJwtPlayload(user);

    this.mailService.sendResetPasswordToken(user, token);

    return {
      message: 'The instruction was successfully sent to the user mail',
    };
  }

  async resetPassword(email: string, resetPasswordDto: ResetPasswordDto) {
    const user = await this.usersService.findByEmail(email);

    const isPasswordMatching = await this.isVerifyPassword(
      resetPasswordDto.currentPassword,
      user.password,
    );

    if (!isPasswordMatching) {
      throw new HttpException(
        'Current password is incorrect',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (
      resetPasswordDto.newPassword !== resetPasswordDto.newPasswordConfirmation
    ) {
      throw new HttpException('Passwords do not match', HttpStatus.BAD_REQUEST);
    }

    const password = await this.usersService.bcryptPassword(
      resetPasswordDto.newPassword,
    );

    await this.usersService.update(user._id, { password });

    return user;
  }

  private async isVerifyPassword(
    plainTextPassword: string,
    hashedPassword: string,
  ) {
    return await bcrypt.compare(plainTextPassword, hashedPassword);
  }

  private createJwtPlayload(user: IUser): string {
    const payload = { id: user._id, email: user.email };

    return this.jwtService.sign(payload, {
      secret: process.env.JWT_TOKEN_SECRET,
      expiresIn: process.env.JWT_TOKEN_EXPIRATION_TIME,
    });
  }
}
