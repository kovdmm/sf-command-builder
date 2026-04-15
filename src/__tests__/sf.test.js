import { sf } from "../sf.js";

describe("sf command builder", () => {
    test("should not cache state between calls", () => {
        // Arrange
        const command = sf.project.deploy.start;

        // Act & Assert
        expect(command.__wait(10).toString()).toBe("sf project deploy start --wait 10");
        expect(command.__wait(10).toString()).toBe("sf project deploy start --wait 10");
    });

    test("should not cache state between calls when using $flag", () => {
        // Arrange
        const command = sf.project.deploy.start;

        // Act & Assert
        expect(command.$flag("--wait", 10).toString()).toBe("sf project deploy start --wait 10");
        expect(command.$flag("--wait", 10).toString()).toBe("sf project deploy start --wait 10");
    });

    test.each([null, undefined])("should ignore flags, where value is %s", (value) => {
        // Arrange
        const command = sf.project.deploy.start;

        // Act & Assert
        expect(command.__wait(value).toString()).toBe("sf project deploy start");
        expect(command.$flag("--wait", value).toString()).toBe("sf project deploy start");
    });
});
