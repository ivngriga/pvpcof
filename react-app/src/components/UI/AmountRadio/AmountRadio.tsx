import styles from "./AmountRadio.module.scss";

type onChangeType = (amount: number) => void;

const AmountRadio = (props: {onChange: onChangeType}) => {
    const handleRadioChange  = (event: any) => {
        props.onChange(event.target.value)
    }

    return (
        <fieldset className={styles.radio_amount_fieldset}>
            <legend className={styles.radio_amount_legend}>Select bet amount:</legend> 

            <div className={styles.radio_amount_selector}>
                <input type="radio" id="huey" name="amount" value="0.05" onChange={handleRadioChange}></input>
                <label htmlFor="huey">0.05</label>
            </div>

            <div className={styles.radio_amount_selector}>
                <input type="radio" id="huey" name="amount" value="0.1" onChange={handleRadioChange}></input>
                <label htmlFor="huey">0.1</label>
            </div>

            <div className={styles.radio_amount_selector}>
                <input type="radio" id="dewey" name="amount" value="0.5" onChange={handleRadioChange}></input>
                <label htmlFor="dewey">0.5</label>
            </div>

            <div className={styles.radio_amount_selector}>
                <input type="radio" id="louie" name="amount" value="2" onChange={handleRadioChange}></input>
                <label htmlFor="louie">2</label>    
            </div>
        </fieldset>
    )
}

export default AmountRadio