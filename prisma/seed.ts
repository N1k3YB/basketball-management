import { PrismaClient, PlayerPosition } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Начало инициализации базы данных...');
    const adminRole = await prisma.role.upsert({
      where: { name: 'ADMIN' },
      update: {},
      create: {
        name: 'ADMIN',
        description: 'Администратор системы'
      } as any
    });

    const coachRole = await prisma.role.upsert({
      where: { name: 'COACH' },
      update: {},
      create: {
        name: 'COACH',
        description: 'Тренер'
      } as any
    });

    const playerRole = await prisma.role.upsert({
      where: { name: 'PLAYER' },
      update: {},
      create: {
        name: 'PLAYER',
        description: 'Игрок'
      } as any
    });

    console.log('Создание администратора...');
    const adminEmail = 'admin@example.com';
    const adminPassword = await hash('admin123', 10);
    
    const admin = await prisma.user.upsert({
      where: { email: adminEmail },
      update: {},
      create: {
        email: adminEmail,
        password: adminPassword,
        roleId: adminRole.id,
        isActive: true,
        profile: {
          create: {
            firstName: 'Главный',
            lastName: 'Админ',
            phone: '+7(952)812-34-56',
            address: 'г. Тюмень, ул. Админская, 52'
          } as any
        }
      } as any,
    });

    console.log('Создание тренеров...');
    
    const coachMaleEmail = 'trener1@example.com';
    const coachMalePassword = await hash('password123', 10);
    
    const coachMale = await prisma.user.upsert({
      where: { email: coachMaleEmail },
      update: {},
      create: {
        email: coachMaleEmail,
        password: coachMalePassword,
        roleId: coachRole.id,
        isActive: true,
        profile: {
          create: {
            firstName: 'Алексей',
            lastName: 'Воронцов',
            phone: '+7(912)345-67-89',
            address: 'г. Тюмень, ул. Спортивная, 15'
          } as any
        },
        coach: {
          create: {
            specialization: 'Мужской баскетбол',
            experience: 12
          } as any
        }
      } as any,
      include: {
        coach: true
      }
    });
    const coachFemaleEmail = 'trener2@example.com';
    const coachFemalePassword = await hash('password123', 10);
    
    const coachFemale = await prisma.user.upsert({
      where: { email: coachFemaleEmail },
      update: {},
      create: {
        email: coachFemaleEmail,
        password: coachFemalePassword,
        roleId: coachRole.id,
        isActive: true,
        profile: {
          create: {
            firstName: 'Елена',
            lastName: 'Крылова',
            phone: '+7(922)234-56-78',
            address: 'г. Тюмень, ул. Олимпийская, 32'
          } as any
        },
        coach: {
          create: {
            specialization: 'Женский баскетбол',
            experience: 8
          } as any
        }
      } as any,
      include: {
        coach: true
      }
    });

    const coachYouthEmail = 'trener3@example.com';
    const coachYouthPassword = await hash('password123', 10);
    
    const coachYouth = await prisma.user.upsert({
      where: { email: coachYouthEmail },
      update: {},
      create: {
        email: coachYouthEmail,
        password: coachYouthPassword,
        roleId: coachRole.id,
        isActive: true,
        profile: {
          create: {
            firstName: 'Михаил',
            lastName: 'Соколов',
            phone: '+7(932)123-45-67',
            address: 'г. Тюмень, ул. Юных Спортсменов, 8'
          } as any
        },
        coach: {
          create: {
            specialization: 'Юношеский баскетбол',
            experience: 5
          } as any
        }
      } as any,
      include: {
        coach: true
      }
    });

    console.log('Создание команд...');
    
    const maleTeam = await prisma.team.create({
      data: {
        name: 'Мужская',
        description: 'Мужская сборная по баскетболу',
        coachId: coachMale.coach?.id
      } as any
    });

    const femaleTeam = await prisma.team.create({
      data: {
        name: 'Женская',
        description: 'Женская сборная по баскетболу',
        coachId: coachFemale.coach?.id
      } as any
    });

    const youthTeam = await prisma.team.create({
      data: {
        name: 'Юношеская',
        description: 'Юношеская сборная по баскетболу',
        coachId: coachYouth.coach?.id
      } as any
    });
    console.log('Создание игроков для мужской команды...');
    
    const malePlayers = [
      { firstName: 'Дмитрий', lastName: 'Карпов', position: PlayerPosition.POINT_GUARD, jersey: 4, birthDate: new Date('1992-05-12'), height: 185, weight: 78, isActive: true },
      { firstName: 'Антон', lastName: 'Березин', position: PlayerPosition.SHOOTING_GUARD, jersey: 7, birthDate: new Date('1994-08-23'), height: 188, weight: 82, isActive: true },
      { firstName: 'Николай', lastName: 'Соловьев', position: PlayerPosition.SMALL_FORWARD, jersey: 10, birthDate: new Date('1991-11-08'), height: 195, weight: 90, isActive: true },
      { firstName: 'Сергей', lastName: 'Петров', position: PlayerPosition.POWER_FORWARD, jersey: 15, birthDate: new Date('1990-02-15'), height: 200, weight: 95, isActive: true },
      { firstName: 'Максим', lastName: 'Громов', position: PlayerPosition.CENTER, jersey: 21, birthDate: new Date('1989-06-30'), height: 210, weight: 105, isActive: true },
      { firstName: 'Владимир', lastName: 'Кузнецов', position: PlayerPosition.POINT_GUARD, jersey: 3, birthDate: new Date('1993-04-18'), height: 183, weight: 76, isActive: true },
      { firstName: 'Роман', lastName: 'Белов', position: PlayerPosition.SHOOTING_GUARD, jersey: 8, birthDate: new Date('1995-09-27'), height: 190, weight: 85, isActive: true },
      { firstName: 'Евгений', lastName: 'Смирнов', position: PlayerPosition.SMALL_FORWARD, jersey: 11, birthDate: new Date('1992-12-05'), height: 193, weight: 88, isActive: true },
      { firstName: 'Артём', lastName: 'Козлов', position: PlayerPosition.POWER_FORWARD, jersey: 14, birthDate: new Date('1990-07-19'), height: 198, weight: 93, isActive: true },
      { firstName: 'Денис', lastName: 'Морозов', position: PlayerPosition.CENTER, jersey: 22, birthDate: new Date('1991-03-12'), height: 208, weight: 102, isActive: true },
      { firstName: 'Павел', lastName: 'Лебедев', position: PlayerPosition.POINT_GUARD, jersey: 5, birthDate: new Date('1993-10-09'), height: 184, weight: 77, isActive: false },
      { firstName: 'Иван', lastName: 'Ковалёв', position: PlayerPosition.SHOOTING_GUARD, jersey: 9, birthDate: new Date('1994-01-25'), height: 189, weight: 83, isActive: false }
    ];

    for (let i = 0; i < malePlayers.length; i++) {
      const player = malePlayers[i];
      const playerEmail = `player${i+1}@example.com`;
      const playerPassword = await hash('password123', 10);
      
      const newPlayer = await prisma.user.upsert({
        where: { email: playerEmail },
        update: {},
        create: {
          email: playerEmail,
          password: playerPassword,
          roleId: playerRole.id,
          isActive: player.isActive,
          profile: {
            create: {
              firstName: player.firstName,
              lastName: player.lastName,
              phone: `+7(9${10+i})000-00-${i < 10 ? '0' + i : i}`,
              address: `г. Тюмень, ул. Спортивная, кв. ${i+1}`,
              avatar: ''
            } as any
          },
          player: {
            create: {
              birthDate: player.birthDate,
              height: player.height,
              weight: player.weight,
              position: player.position,
              jerseyNumber: player.jersey
            } as any
          }
        } as any,
        include: {
          player: true
        }
      });

      if (newPlayer.player) {
        await prisma.teamPlayer.create({
          data: {
            teamId: maleTeam.id,
            playerId: newPlayer.player.id,
            isActive: player.isActive
          } as any
        });
      }
    }

    console.log('Создание игроков для женской команды...');
    
    const femalePlayers = [
      { firstName: 'Анна', lastName: 'Иванова', position: PlayerPosition.POINT_GUARD, jersey: 4, birthDate: new Date('1993-07-15'), height: 175, weight: 65, isActive: true },
      { firstName: 'Екатерина', lastName: 'Смирнова', position: PlayerPosition.SHOOTING_GUARD, jersey: 7, birthDate: new Date('1995-03-22'), height: 178, weight: 67, isActive: true },
      { firstName: 'Марина', lastName: 'Кузнецова', position: PlayerPosition.SMALL_FORWARD, jersey: 10, birthDate: new Date('1994-05-18'), height: 182, weight: 70, isActive: true },
      { firstName: 'Ольга', lastName: 'Романова', position: PlayerPosition.POWER_FORWARD, jersey: 15, birthDate: new Date('1992-09-30'), height: 185, weight: 72, isActive: true },
      { firstName: 'Татьяна', lastName: 'Волкова', position: PlayerPosition.CENTER, jersey: 21, birthDate: new Date('1991-11-12'), height: 190, weight: 75, isActive: true },
      { firstName: 'Юлия', lastName: 'Петрова', position: PlayerPosition.POINT_GUARD, jersey: 3, birthDate: new Date('1993-04-25'), height: 174, weight: 64, isActive: true },
      { firstName: 'Наталья', lastName: 'Козлова', position: PlayerPosition.SHOOTING_GUARD, jersey: 8, birthDate: new Date('1995-06-14'), height: 177, weight: 66, isActive: true },
      { firstName: 'Виктория', lastName: 'Лебедева', position: PlayerPosition.SMALL_FORWARD, jersey: 11, birthDate: new Date('1994-02-08'), height: 180, weight: 69, isActive: true },
      { firstName: 'Дарья', lastName: 'Соколова', position: PlayerPosition.POWER_FORWARD, jersey: 14, birthDate: new Date('1992-12-21'), height: 184, weight: 71, isActive: true },
      { firstName: 'Елизавета', lastName: 'Новикова', position: PlayerPosition.CENTER, jersey: 22, birthDate: new Date('1991-08-17'), height: 188, weight: 74, isActive: true },
      { firstName: 'Алина', lastName: 'Морозова', position: PlayerPosition.POINT_GUARD, jersey: 5, birthDate: new Date('1993-10-03'), height: 176, weight: 65, isActive: false },
      { firstName: 'Полина', lastName: 'Васильева', position: PlayerPosition.SHOOTING_GUARD, jersey: 9, birthDate: new Date('1995-01-19'), height: 179, weight: 68, isActive: false }
    ];

    for (let i = 0; i < femalePlayers.length; i++) {
      const player = femalePlayers[i];
      const playerEmail = `player${i+13}@example.com`;
      const playerPassword = await hash('password123', 10);
      
      const newPlayer = await prisma.user.upsert({
        where: { email: playerEmail },
        update: {},
        create: {
          email: playerEmail,
          password: playerPassword,
          roleId: playerRole.id,
          isActive: player.isActive,
          profile: {
            create: {
              firstName: player.firstName,
              lastName: player.lastName,
              phone: `+7(9${30+i})000-00-${i < 10 ? '0' + i : i}`,
              address: `г. Тюмень, ул. Олимпийская, кв. ${i+1}`
            } as any
          },
          player: {
            create: {
              birthDate: player.birthDate,
              height: player.height,
              weight: player.weight,
              position: player.position,
              jerseyNumber: player.jersey
            } as any
          }
        } as any,
        include: {
          player: true
        }
      });

      if (newPlayer.player) {
        await prisma.teamPlayer.create({
          data: {
            teamId: femaleTeam.id,
            playerId: newPlayer.player.id,
            isActive: player.isActive
          } as any
        });
      }
    }

    console.log('Создание игроков для юношеской команды...');
    
    const youthPlayers = [
      { firstName: 'Александр', lastName: 'Морозов', position: PlayerPosition.POINT_GUARD, jersey: 4, birthDate: new Date('2010-03-15'), height: 178, weight: 68, isActive: true },
      { firstName: 'Михаил', lastName: 'Петров', position: PlayerPosition.SHOOTING_GUARD, jersey: 7, birthDate: new Date('2009-06-22'), height: 180, weight: 70, isActive: true },
      { firstName: 'Кирилл', lastName: 'Соколов', position: PlayerPosition.SMALL_FORWARD, jersey: 10, birthDate: new Date('2009-09-11'), height: 185, weight: 75, isActive: true },
      { firstName: 'Даниил', lastName: 'Волков', position: PlayerPosition.POWER_FORWARD, jersey: 15, birthDate: new Date('2009-02-28'), height: 188, weight: 77, isActive: true },
      { firstName: 'Никита', lastName: 'Новиков', position: PlayerPosition.CENTER, jersey: 21, birthDate: new Date('2010-11-07'), height: 195, weight: 85, isActive: true },
      { firstName: 'Тимофей', lastName: 'Кузнецов', position: PlayerPosition.POINT_GUARD, jersey: 3, birthDate: new Date('2009-07-19'), height: 176, weight: 67, isActive: true },
      { firstName: 'Артемий', lastName: 'Смирнов', position: PlayerPosition.SHOOTING_GUARD, jersey: 8, birthDate: new Date('2012-04-13'), height: 179, weight: 69, isActive: true },
      { firstName: 'Матвей', lastName: 'Иванов', position: PlayerPosition.SMALL_FORWARD, jersey: 11, birthDate: new Date('2009-01-24'), height: 184, weight: 73, isActive: true },
      { firstName: 'Глеб', lastName: 'Козлов', position: PlayerPosition.POWER_FORWARD, jersey: 14, birthDate: new Date('2011-08-05'), height: 187, weight: 76, isActive: true },
      { firstName: 'Степан', lastName: 'Андреев', position: PlayerPosition.CENTER, jersey: 22, birthDate: new Date('2010-12-16'), height: 193, weight: 83, isActive: true },
      { firstName: 'Марк', lastName: 'Васильев', position: PlayerPosition.POINT_GUARD, jersey: 5, birthDate: new Date('2012-05-27'), height: 177, weight: 68, isActive: false },
      { firstName: 'Федор', lastName: 'Лебедев', position: PlayerPosition.SHOOTING_GUARD, jersey: 9, birthDate: new Date('2008-03-08'), height: 181, weight: 71, isActive: false }
    ];

    for (let i = 0; i < youthPlayers.length; i++) {
      const player = youthPlayers[i];
      const playerEmail = `player${i+25}@example.com`;
      const playerPassword = await hash('password123', 10);
      
      const newPlayer = await prisma.user.upsert({
        where: { email: playerEmail },
        update: {},
        create: {
          email: playerEmail,
          password: playerPassword,
          roleId: playerRole.id,
          isActive: player.isActive,
          profile: {
            create: {
              firstName: player.firstName,
              lastName: player.lastName,
              phone: `+7(9${50+i})000-00-${i < 10 ? '0' + i : i}`,
              address: `г. Тюмень, ул. Юных Спортсменов, кв. ${i+1}`
            } as any
          },
          player: {
            create: {
              birthDate: player.birthDate,
              height: player.height,
              weight: player.weight,
              position: player.position,
              jerseyNumber: player.jersey
            } as any
          }
        } as any,
        include: {
          player: true
        }
      });

      if (newPlayer.player) {
        await prisma.teamPlayer.create({
          data: {
            teamId: youthTeam.id,
            playerId: newPlayer.player.id,
            isActive: player.isActive
          } as any
        });
      }
    }

    console.log('Инициализация базы данных завершена.');
  } catch (error) {
    console.error('Ошибка при инициализации базы данных:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 