import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './users.entity';
 
@Entity('voting')
export class Voting {
  @PrimaryGeneratedColumn()
  id: number;
 
  @Column()
  user_id: number;
 
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
 
  @Column()
  vote_value: number;
 
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  voted_at: Date;
}
