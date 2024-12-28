'use client';  

import styles from "./page.module.css";
import Table from "./components/Table";

export default function Home() {
  return (
    <div className={styles.page}>
        <h1>Hello World</h1>
        <Table />
    </div>
  );
}
