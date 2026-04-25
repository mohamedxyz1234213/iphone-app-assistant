import SwiftUI
import FamilyControls

/// SwiftUI view that presents the system FamilyActivityPicker for selecting apps to block.
/// Present this view from a UIViewController using UIHostingController.
///
/// Usage:
///   let picker = UIHostingController(rootView: ScreenTimePicker(selection: $selection))
///   present(picker, animated: true)
@available(iOS 16.0, *)
struct ScreenTimePicker: View {
  @Binding var selection: FamilyActivitySelection
  @Environment(\.dismiss) private var dismiss

  var onConfirm: ((FamilyActivitySelection) -> Void)?

  var body: some View {
    NavigationView {
      FamilyActivityPicker(selection: $selection)
        .navigationTitle("Select Apps to Block")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
          ToolbarItem(placement: .navigationBarLeading) {
            Button("Cancel") { dismiss() }
          }
          ToolbarItem(placement: .navigationBarTrailing) {
            Button("Done") {
              onConfirm?(selection)
              dismiss()
            }
            .fontWeight(.semibold)
          }
        }
    }
    .accentColor(.blue)
  }
}
