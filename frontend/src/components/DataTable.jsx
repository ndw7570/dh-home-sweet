import "./DataTable.css";

/**
 * 표 하나.
 *
 * columns: [{ key, label, align, width, render(row) }]
 * 값이 없을 때 빈칸 대신 `—` 를 찍는다. 빈칸은 '값이 0' 인지 '아직 안 넣었는지'
 * 구분이 안 돼서, 반쯤 채운 데이터로 판단해 버리는 사고가 난다.
 */
export default function DataTable({ columns, rows, rowKey = "id", empty, onRowClick }) {
  if (!rows?.length) {
    return <p className="dt-empty">{empty || "아직 데이터가 없다."}</p>;
  }
  return (
    <div className="dt-scroll">
      <table className="dt">
        <thead>
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                style={{ textAlign: c.align || "left", width: c.width }}
                scope="col"
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row[rowKey] ?? i}
              className={onRowClick ? "is-clickable" : ""}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              {columns.map((c) => {
                const value = c.render ? c.render(row) : row[c.key];
                return (
                  <td
                    key={c.key}
                    style={{ textAlign: c.align || "left" }}
                    className={c.align === "right" ? "num" : undefined}
                  >
                    {value === null || value === undefined || value === "" ? "—" : value}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
