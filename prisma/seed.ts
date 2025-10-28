import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean up existing data
  await prisma.conversationBlob.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();

  // Create test user
  const passwordHash = await argon2.hash('password123');
  const user = await prisma.user.create({
    data: {
      email: 'test@example.com',
      passwordHash,
    },
  });

  console.log('✅ Created user:', user.email);

  // Create conversations with messages
  const conv1 = await prisma.conversation.create({
    data: {
      userId: user.id,
      title: 'がん保険の相談',
      messageCount: 6,
      messages: {
        create: [
          {
            role: 'user',
            content: 'こんにちは。がん保険について相談したいのですが。',
            index: 0,
            tokenIn: 15,
            tokenOut: 0,
          },
          {
            role: 'assistant',
            content: 'こんにちは。よろしくお願いします。がん保険についてどのようなご質問がありますか？',
            index: 1,
            tokenIn: 0,
            tokenOut: 28,
          },
          {
            role: 'user',
            content: '月5万円で保障1000万円のプランがあります。いかがでしょうか？',
            index: 2,
            tokenIn: 25,
            tokenOut: 0,
          },
          {
            role: 'assistant',
            content:
              '1000万円は大きい保障ですね。ただ、月5万円を30年払うと総額1800万円になりますよね。実質的には800万円のマイナスですが、この差額は何に使われるんですか？同じ予算で投資信託に回した方が、資産形成としては有利だと思うのですが。',
            index: 3,
            tokenIn: 0,
            tokenOut: 95,
          },
          {
            role: 'user',
            content: '保障部分と経費、そして運用に使われます。',
            index: 4,
            tokenIn: 20,
            tokenOut: 0,
          },
          {
            role: 'assistant',
            content:
              'なるほど。では具体的に保険料の内訳を教えていただけますか？何％が保障で、何％が経費と運用ですか？また、運用部分の利回りはどのくらいを想定されていますか？',
            index: 5,
            tokenIn: 0,
            tokenOut: 70,
          },
        ],
      },
    },
  });

  console.log('✅ Created conversation:', conv1.title);

  const conv2 = await prisma.conversation.create({
    data: {
      userId: user.id,
      title: '医療保険の見直し',
      messageCount: 4,
      messages: {
        create: [
          {
            role: 'user',
            content: '医療保険の見直しをしたいと思っています。',
            index: 0,
            tokenIn: 18,
            tokenOut: 0,
          },
          {
            role: 'assistant',
            content: '医療保険の見直しですね。現在どのような保険に加入されていますか？',
            index: 1,
            tokenIn: 0,
            tokenOut: 30,
          },
          {
            role: 'user',
            content: '月3万円の終身医療保険に入っています。',
            index: 2,
            tokenIn: 18,
            tokenOut: 0,
          },
          {
            role: 'assistant',
            content:
              '終身型ですね。高額療養費制度があれば医療費は月10万円程度で済みますし、貯蓄でカバーする方が柔軟だと思うのですが、月3万円を30年払うと総額1080万円です。その必要性について教えていただけますか？',
            index: 3,
            tokenIn: 0,
            tokenOut: 85,
          },
        ],
      },
    },
  });

  console.log('✅ Created conversation:', conv2.title);

  // Create archived conversation
  const conv3 = await prisma.conversation.create({
    data: {
      userId: user.id,
      title: '過去の相談（アーカイブ済み）',
      messageCount: 2,
      archived: true,
      messages: {
        create: [
          {
            role: 'user',
            content: 'こんにちは',
            index: 0,
            tokenIn: 5,
            tokenOut: 0,
          },
          {
            role: 'assistant',
            content: 'こんにちは。よろしくお願いします。',
            index: 1,
            tokenIn: 0,
            tokenOut: 15,
          },
        ],
      },
      conversationBlob: {
        create: {
          storageKey: 'file://data/archived/conv_sample.jsonl',
          bytes: 256,
        },
      },
    },
  });

  console.log('✅ Created archived conversation:', conv3.title);

  console.log('');
  console.log('🎉 Seed completed!');
  console.log('');
  console.log('Test user credentials:');
  console.log('  Email: test@example.com');
  console.log('  Password: password123');
  console.log('');
  console.log(`Total conversations: 3`);
  console.log(`Total messages: ${conv1.messageCount + conv2.messageCount + conv3.messageCount}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
