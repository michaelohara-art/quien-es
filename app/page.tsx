import Link from 'next/link';

export default function Home() {
  return (
    <div className="container">
      <p>Hello welkcome fella</p>
      <Link href='sign-in' className='button'><button>Sign in</button></Link>
    </div>
  );
}
