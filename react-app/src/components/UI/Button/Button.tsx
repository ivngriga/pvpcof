import styles from "./Button.module.scss";

const Button = (props: { id?: string; onClick?: () => void; children: string; disabled?: boolean }) => {
  return (
    <button className={styles.button} id={props.id} onClick={props.onClick} disabled={props.disabled}>
      {props.children}
    </button>
  );
};

export default Button;
