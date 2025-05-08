import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  username: string;

  @Column()
  email: string;

  @Column()
  user_password: string;

  @Column()
  fullname: string;

  @Column({ type: 'varchar', length: 512, nullable: true })
  token?: string;
}
