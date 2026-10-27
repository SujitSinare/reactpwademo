export default function handler(req: any, res: any) {
  const publicKey = process.env.VAPID_PUBLIC_KEY || 'BGubeRBQtuBUbFZlAY6BdjdC0py0ac1T8r519D-x8RZXu8lrPiaQQCxA-yyIXPTOiJQ9vTRQ0Nri6hWRvFsGiVk';
  res.status(200).json({ publicKey });
}
