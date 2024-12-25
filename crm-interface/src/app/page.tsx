import Image from "next/image";
import styles from "./page.module.css";
import ProjectOverview from './components/ProjectOverview';


export default function Page() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1>GraphQL Project Overview</h1>
        <ProjectOverview />
      </main>
    </div>
  );
}
