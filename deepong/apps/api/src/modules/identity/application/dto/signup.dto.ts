import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class SignupDto {
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다.' })
  email!: string;

  @IsString()
  @MinLength(8, { message: '비밀번호는 8자 이상이어야 합니다.' })
  password!: string;

  @IsString()
  @IsNotEmpty({ message: '닉네임은 필수입니다.' })
  @MaxLength(50, { message: '닉네임은 50자 이하여야 합니다.' })
  nickname!: string;
}
