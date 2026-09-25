export function createEnterSubmitHandler(submit: () => void): (event: KeyboardEvent) => void {
  return (event: KeyboardEvent) => {
    if (event.key === "Enter") {
      submit();
    }
  };
}
