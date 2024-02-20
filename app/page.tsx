import Image from "next/image";

export default function Home() {
  return (
    <div>
      <h1 style={{ padding: "10px" }}>Welcome to My (very polished) Website</h1>
      <div className="center-image">
        <Image
          src="/profile_pic_2.jpg"
          alt="Profile Picture"
          width={200}
          height={200}
          style={{ borderRadius: "100%" }}
        />
      </div>
    </div>
  );
}
