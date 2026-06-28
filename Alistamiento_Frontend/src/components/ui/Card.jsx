export const Card = ({ titulo, descripcion, onClick }) => {
    return (
        <div
            className="card"
            onClick={onClick}
            style={{ cursor: "pointer" }}
        >
            <h3>{titulo}</h3>
            <p>{descripcion}</p>
        </div>
    )
}