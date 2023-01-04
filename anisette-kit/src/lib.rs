extern crate objc2;

pub mod base {
    use objc2::rc::{Id, Owned};
    use objc2::runtime::NSObject;

    #[cfg(target_os = "macos")]
    #[link(name = "aoshelper")]
    extern "C" {
        fn getAnisetteData() -> Id<NSObject, Owned>;
    }

    #[cfg(target_os = "macos")]
    pub fn anisette_data() -> String {
        unsafe {
            let aosdata: Id<NSObject, Owned> = getAnisetteData();
            return format!("{:?}", aosdata);
        };
    }

    #[cfg(not(target_os = "macos"))]
    fn anisette_data() {
        return;
    }
}
