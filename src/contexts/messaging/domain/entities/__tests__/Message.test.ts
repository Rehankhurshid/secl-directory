import { Message } from "../Message";

describe("Message Entity", () => {
  it("should identify if message can be edited", () => {
    const message = new Message(
      "1",
      "conv1",
      "user1",
      "Hello",
      "text",
      new Date()
    );

    expect(message.canBeEditedBy("user1")).toBe(true);
    expect(message.canBeEditedBy("user2")).toBe(false);
  });

  it("should not allow editing after 15 minutes", () => {
    const oldDate = new Date();
    oldDate.setMinutes(oldDate.getMinutes() - 16);

    const message = new Message(
      "1",
      "conv1",
      "user1",
      "Hello",
      "text",
      oldDate
    );

    expect(message.canBeEditedBy("user1")).toBe(false);
  });

  it("should not allow editing deleted messages", () => {
    const message = new Message(
      "1",
      "conv1",
      "user1",
      "Hello",
      "text",
      new Date(),
      undefined,
      new Date() // deletedAt
    );

    expect(message.canBeEditedBy("user1")).toBe(false);
  });

  it("should correctly identify edited messages", () => {
    const messageNotEdited = new Message(
      "1",
      "conv1",
      "user1",
      "Hello",
      "text",
      new Date()
    );

    const messageEdited = new Message(
      "2",
      "conv1",
      "user1",
      "Hello edited",
      "text",
      new Date(),
      new Date() // editedAt
    );

    expect(messageNotEdited.isEdited()).toBe(false);
    expect(messageEdited.isEdited()).toBe(true);
  });

  it("should correctly identify deleted messages", () => {
    const messageNotDeleted = new Message(
      "1",
      "conv1",
      "user1",
      "Hello",
      "text",
      new Date()
    );

    const messageDeleted = new Message(
      "2",
      "conv1",
      "user1",
      "Hello",
      "text",
      new Date(),
      undefined,
      new Date() // deletedAt
    );

    expect(messageNotDeleted.isDeleted()).toBe(false);
    expect(messageDeleted.isDeleted()).toBe(true);
  });
});