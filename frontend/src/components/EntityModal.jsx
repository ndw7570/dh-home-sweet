import EntityForm from "./EntityForm";
import Modal from "./Modal";

/**
 * `useEntityForm` + `Modal` + `EntityForm` 을 한 줄로 묶는다.
 *
 *   const form = useEntityForm(reload);
 *   <EntityModal form={form} title="종목" fields={SECURITY_FIELDS}
 *                api={security} optionsMap={{ accounts }} />
 *
 * 화면마다 모달 마크업을 다시 쓰면 저장 실패 처리나 삭제 확인이 화면마다 갈린다.
 */
export default function EntityModal({ form, title, subtitle, fields, api, optionsMap, wide }) {
  if (!form.isOpen) return null;

  return (
    <Modal
      title={`${title} ${form.isEdit ? "수정" : "추가"}`}
      subtitle={subtitle}
      onClose={form.close}
      wide={wide}
    >
      <EntityForm
        fields={fields}
        instance={form.instance}
        optionsMap={optionsMap}
        onSubmit={form.submit(api)}
        onCancel={form.close}
        onDelete={form.isEdit ? form.remove(api) : undefined}
      />
    </Modal>
  );
}

/** 목록 행 오른쪽에 붙는 작은 수정 버튼. */
export function EditButton({ onClick, label = "수정" }) {
  return (
    <button
      type="button"
      className="row-edit"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      {label}
    </button>
  );
}
