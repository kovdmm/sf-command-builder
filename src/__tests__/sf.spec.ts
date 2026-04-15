import { sf } from "../sf";

describe("sf command builder", () => {
    test("should build commands correctly", () => {
        expect(sf.toString()).toBe("sf");
        expect(sf.help.toString()).toBe("sf help");
        expect(sf.org.list.toString()).toBe("sf org list");
        expect(sf.org.login.web.__setDefault.toString()).toBe("sf org login web --set-default");
        expect(sf.org.login.web.$flag("--set-default").toString()).toBe("sf org login web --set-default");
        expect(sf.project.deploy.start.__wait(10).toString()).toBe("sf project deploy start --wait 10");
        expect(sf.project.deploy.start.$flag("--wait", 10).toString()).toBe("sf project deploy start --wait 10");
        expect(sf.project.deploy.start.__targetOrg(null).toString()).toBe("sf project deploy start");
        expect(sf.project.deploy.start.$flag("--target-org", null).toString()).toBe("sf project deploy start");
    });
});
